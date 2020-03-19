import ipywidgets as W
import logging
import traitlets as T

from typing import Optional, Dict, List, Hashable, Callable
from .styled_widget import StyledWidget
from .diagram import ElkDiagram, ElkExtendedEdge, ElkNode, ElkLabel
from dataclasses import dataclass


logger = logging.getLogger(__name__)


class ElkTransformer(W.Widget):
    _nodes: Optional[Dict[Hashable, ElkNode]] = None
    source = T.Dict()
    value = T.Dict(kw={})
    _version: str = "v1"

    @T.validate("value")
    def _validate_elk_json_schema(self, proposal: T.Bunch):
        value: Dict = proposal.value
        # TODO load json schema for elk at this Transformer version and validate
        return value

    def to_dict(self):
        """Generate elk json"""
        return self.source

    @T.observe("source")
    def refresh(self, change: T.Bunch = None) -> Dict:
        """Method to update this transform's value"""
        logger.debug("Refreshing elk transformer")
        self.value = self.to_dict()
        labels = self.value.get("labels", [])

        labels.append(ElkLabel(id=str(id(self.value))).to_dict())

        self.value["labels"]=labels

        return self.value


class Elk(W.VBox, StyledWidget):
    transformer:ElkTransformer = T.Instance(ElkTransformer)
    diagram:ElkDiagram = T.Instance(ElkDiagram)

    _link: T.dlink = None

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._update_link()
        self._update_children()

    @T.default("diagram")
    def _default_diagram(self):
        return ElkDiagram()

    @T.default("transformer")
    def _default_transformer(self):
        return ElkTransformer()

    @T.observe("diagram", "transformer")
    def _update_link(self, change: T.Bunch = None):
        if isinstance(self._link, T.link):
            self._link.unlink()
            self._link = None
        if self.transformer and self.diagram:
            self._link = T.dlink((self.transformer, "value"), (self.diagram, "value"))

    @T.observe("diagram")
    def _update_children(self, change: T.Bunch = None):
        self.children = [self.diagram]

    def refresh(self):
        self.transformer.refresh()
